import { useEffect, useRef, useCallback } from 'react'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { useAuthStore } from '@/store/authStore'

interface UseWebSocketOptions {
  onConnect?: () => void
  onDisconnect?: () => void
}

export function useWebSocket(options?: UseWebSocketOptions) {
  const clientRef = useRef<Client | null>(null)
  const { accessToken } = useAuthStore()

  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS('/ws'),
      connectHeaders: { Authorization: `Bearer ${accessToken}` },
      reconnectDelay: 3000,
      onConnect: () => options?.onConnect?.(),
      onDisconnect: () => options?.onDisconnect?.(),
    })

    client.activate()
    clientRef.current = client

    return () => {
      client.deactivate()
    }
  }, [accessToken])

  const subscribe = useCallback((destination: string, callback: (body: any) => void) => {
    const client = clientRef.current
    if (!client?.connected) return () => {}
    const sub = client.subscribe(destination, (msg) => {
      try {
        callback(JSON.parse(msg.body))
      } catch {
        callback(msg.body)
      }
    })
    return () => sub.unsubscribe()
  }, [])

  const send = useCallback((destination: string, body: object) => {
    clientRef.current?.publish({
      destination,
      body: JSON.stringify(body),
    })
  }, [])

  return { subscribe, send, client: clientRef }
}
