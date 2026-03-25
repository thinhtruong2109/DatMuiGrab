import { useEffect, useRef, useCallback } from 'react'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { useAuthStore } from '@/store/authStore'

interface PendingSubscription {
  id: number
  destination: string
  callback: (body: any) => void
  unsubscribe?: () => void
}

interface UseWebSocketOptions {
  onConnect?: () => void
  onDisconnect?: () => void
}

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() || '/api'
const apiBaseUrlNoTrailingSlash = apiBaseUrl.replace(/\/$/, '')
const apiBaseUrlWithoutLegacyPrefix = apiBaseUrlNoTrailingSlash.replace(/\/(datmuigrab|grabdatmui)-api(?=\/|$)/i, '')
const normalizedApiBaseUrl = /\/api$/i.test(apiBaseUrlNoTrailingSlash)
  ? apiBaseUrlWithoutLegacyPrefix
  : `${apiBaseUrlWithoutLegacyPrefix || ''}/api`
const sockJsEndpoint = `${normalizedApiBaseUrl.replace(/\/api$/i, '')}/ws`

export function useWebSocket(options?: UseWebSocketOptions) {
  const clientRef = useRef<Client | null>(null)
  const subscriptionsRef = useRef<PendingSubscription[]>([])
  const subscriptionIdRef = useRef(0)
  const { accessToken } = useAuthStore()

  useEffect(() => {
    const activatePendingSubscriptions = () => {
      const client = clientRef.current
      if (!client?.connected) return

      subscriptionsRef.current.forEach((sub) => {
        if (sub.unsubscribe) return
        const stompSub = client.subscribe(sub.destination, (msg) => {
          try {
            sub.callback(JSON.parse(msg.body))
          } catch {
            sub.callback(msg.body)
          }
        })
        sub.unsubscribe = () => stompSub.unsubscribe()
      })
    }

    const client = new Client({
      webSocketFactory: () => new SockJS(sockJsEndpoint),
      connectHeaders: { Authorization: `Bearer ${accessToken}` },
      reconnectDelay: 3000,
      onConnect: () => {
        activatePendingSubscriptions()
        options?.onConnect?.()
      },
      onDisconnect: () => options?.onDisconnect?.(),
    })

    client.activate()
    clientRef.current = client

    return () => {
      subscriptionsRef.current.forEach((sub) => {
        sub.unsubscribe?.()
        sub.unsubscribe = undefined
      })
      client.deactivate()
    }
  }, [accessToken])

  const subscribe = useCallback((destination: string, callback: (body: any) => void) => {
    const id = ++subscriptionIdRef.current
    const item: PendingSubscription = { id, destination, callback }
    subscriptionsRef.current.push(item)

    const client = clientRef.current
    if (client?.connected) {
      const stompSub = client.subscribe(destination, (msg) => {
        try {
          callback(JSON.parse(msg.body))
        } catch {
          callback(msg.body)
        }
      })
      item.unsubscribe = () => stompSub.unsubscribe()
    }

    return () => {
      const idx = subscriptionsRef.current.findIndex((s) => s.id === id)
      if (idx !== -1) {
        subscriptionsRef.current[idx].unsubscribe?.()
        subscriptionsRef.current.splice(idx, 1)
      }
    }
  }, [])

  const send = useCallback((destination: string, body: object) => {
    clientRef.current?.publish({
      destination,
      body: JSON.stringify(body),
    })
  }, [])

  return { subscribe, send, client: clientRef }
}
