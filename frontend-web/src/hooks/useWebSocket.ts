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

interface WebSocketRuntimeState {
  client: Client | null
  accessToken: string | null
  consumerCount: number
  subscriptions: PendingSubscription[]
  nextSubscriptionId: number
  connectListeners: Set<() => void>
  disconnectListeners: Set<() => void>
}

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() || '/api'
const apiBaseUrlNoTrailingSlash = apiBaseUrl.replace(/\/$/, '')
const normalizedApiBaseUrl = /\/api$/i.test(apiBaseUrlNoTrailingSlash)
  ? apiBaseUrlNoTrailingSlash
  : `${apiBaseUrlNoTrailingSlash}/api`
const sockJsEndpoint = `${normalizedApiBaseUrl.replace(/\/api$/i, '')}/ws`

const runtimeState: WebSocketRuntimeState = {
  client: null,
  accessToken: null,
  consumerCount: 0,
  subscriptions: [],
  nextSubscriptionId: 0,
  connectListeners: new Set(),
  disconnectListeners: new Set(),
}

const parseMessageBody = (body: string) => {
  try {
    return JSON.parse(body)
  } catch {
    return body
  }
}

const activatePendingSubscriptions = () => {
  const client = runtimeState.client
  if (!client?.connected) return

  runtimeState.subscriptions.forEach((sub) => {
    if (sub.unsubscribe) return

    const stompSub = client.subscribe(sub.destination, (msg) => {
      sub.callback(parseMessageBody(msg.body))
    })

    sub.unsubscribe = () => stompSub.unsubscribe()
  })
}

const deactivateClient = () => {
  runtimeState.subscriptions.forEach((sub) => {
    sub.unsubscribe?.()
    sub.unsubscribe = undefined
  })

  runtimeState.client?.deactivate()
  runtimeState.client = null
}

const ensureClient = (accessToken?: string) => {
  if (!accessToken) return

  if (runtimeState.client && runtimeState.accessToken === accessToken) {
    return
  }

  deactivateClient()
  runtimeState.accessToken = accessToken

  const client = new Client({
    webSocketFactory: () => new SockJS(sockJsEndpoint),
    connectHeaders: { Authorization: `Bearer ${accessToken}` },
    reconnectDelay: 3000,
    onConnect: () => {
      activatePendingSubscriptions()
      runtimeState.connectListeners.forEach((listener) => listener())
    },
    onDisconnect: () => {
      runtimeState.disconnectListeners.forEach((listener) => listener())
    },
  })

  runtimeState.client = client
  client.activate()
}

export function useWebSocket(options?: UseWebSocketOptions) {
  const clientRef = useRef<Client | null>(runtimeState.client)
  const { accessToken } = useAuthStore()

  useEffect(() => {
    runtimeState.consumerCount += 1
    if (options?.onConnect) runtimeState.connectListeners.add(options.onConnect)
    if (options?.onDisconnect) runtimeState.disconnectListeners.add(options.onDisconnect)

    ensureClient(accessToken)
    clientRef.current = runtimeState.client

    return () => {
      runtimeState.consumerCount = Math.max(0, runtimeState.consumerCount - 1)

      if (options?.onConnect) runtimeState.connectListeners.delete(options.onConnect)
      if (options?.onDisconnect) runtimeState.disconnectListeners.delete(options.onDisconnect)

      if (runtimeState.consumerCount === 0) {
        runtimeState.subscriptions = []
        deactivateClient()
        runtimeState.accessToken = null
      }
    }
  }, [accessToken, options?.onConnect, options?.onDisconnect])

  const subscribe = useCallback((destination: string, callback: (body: any) => void) => {
    const id = ++runtimeState.nextSubscriptionId
    const item: PendingSubscription = { id, destination, callback }
    runtimeState.subscriptions.push(item)

    const client = runtimeState.client
    if (client?.connected) {
      const stompSub = client.subscribe(destination, (msg) => {
        callback(parseMessageBody(msg.body))
      })
      item.unsubscribe = () => stompSub.unsubscribe()
    }

    return () => {
      const idx = runtimeState.subscriptions.findIndex((s) => s.id === id)
      if (idx !== -1) {
        runtimeState.subscriptions[idx].unsubscribe?.()
        runtimeState.subscriptions.splice(idx, 1)
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
