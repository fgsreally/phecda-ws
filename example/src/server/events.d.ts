import 'phecda-server-ws'
declare module 'phecda-server-ws' {
    interface ClientEvents {
        test: { name: string }
    }
}