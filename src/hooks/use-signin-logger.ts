"use client"

import { useEffect } from "react"
import { useUser } from "@clerk/nextjs"

export function useSignInLogger() {
    const { isSignedIn, isLoaded } = useUser()

    useEffect(() => {
        if (isLoaded && isSignedIn) {
            // Check if we already logged this session to avoid partial re-renders triggering it
            const hasLogged = sessionStorage.getItem("hasLoggedSignIn")
            if (!hasLogged) {
                fetch("/api/log-signin", { method: "POST" })
                    .then(res => {
                        if (res.ok) {
                            sessionStorage.setItem("hasLoggedSignIn", "true")
                        }
                    })
                    .catch(err => console.error("Failed to log sign-in", err))
            }
        }
    }, [isLoaded, isSignedIn])
}
