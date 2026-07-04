import { Eye, EyeOff } from "lucide-react"
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import React, { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input, InputWrapper } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Spinner } from '@/components/ui/spinner'
import { signIn } from "@/api/auth"
import { Link, useNavigate } from "react-router-dom"


const FormSchema = z
    .object({
        email: z.string(),
        password: z.string()
    })
    .superRefine((data, ctx) => {
        // Validate email
        if (!data.email || data.email.trim().length === 0) {
            ctx.addIssue({
                code: 'custom',
                message: 'Email is required',
                path: ['email']
            })
            return
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(data.email)) {
            ctx.addIssue({
                code: 'custom',
                message: 'Please enter a valid email address',
                path: ['email']
            })
            return
        }
    })

export default function SignInForm() {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const navigate = useNavigate()



    const [showPassword, setShowPassword] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    function togglePasswordVisibility(e: React.MouseEvent) {
        e.preventDefault()
        e.stopPropagation()
        setShowPassword(!showPassword)
    }

    const IconComponent = showPassword ? <Eye /> : <EyeOff />

    const form = useForm<z.infer<typeof FormSchema>>({
        resolver: zodResolver(FormSchema),
        mode: 'onSubmit',
        reValidateMode: 'onChange',
        defaultValues: {
            email: '',
            password: ''
        }
    })

    const onSubmit = async (data: z.infer<typeof FormSchema>) => {
        setError(null)
        setIsLoading(true)
        try {
            await signIn(data.email, data.password)
            navigate('/', { replace: true })
        } catch (err) {
            setError((err as Error).message)
            console.log(err)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="w-100 flex bg-bg border border-border rounded-2xl py-8 px-6 ">
            <div className="flex-1 flex flex-col gap-8">
                <div className="flex gap-2 flex-col">
                    <h1 className=" heading-5">Sign In</h1>
                    <p className="text-fg-secondary text-sm">
                        Don't have an account?
                        <Button variant="link" asChild color="primary">
                            <Link to="/sign-up">Sign up</Link>
                        </Button>
                    </p>
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <div className="flex gap-8 flex-col">
                            <div className="flex gap-4 flex-col">
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email Address</FormLabel>
                                            <FormControl>
                                                <Input size="36" type="email" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Password</FormLabel>
                                            <FormControl>
                                                <InputWrapper>
                                                    <Input
                                                        {...field}
                                                        id="toggle-visible-password"
                                                        ref={inputRef}
                                                        className="peer"
                                                        type={showPassword ? 'text' : 'password'}
                                                    />
                                                    {React.cloneElement(IconComponent, {
                                                        className: "hover:text-fg peer-disabled:text-fg-disabled cursor-pointer peer-disabled:pointer-events-none",
                                                        onMouseDown: togglePasswordVisibility
                                                    })}
                                                </InputWrapper>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="flex gap-2 flex-col">
                                {error && <p className="text-error-text text-sm">{error}</p>}
                                <Button className="w-full" type="submit" disabled={isLoading}>
                                    {isLoading ? <Spinner variant="default" /> : 'Sign In'}
                                </Button>
                            </div>
                        </div>
                    </form>
                </Form>
            </div>
        </div>
    )
}
