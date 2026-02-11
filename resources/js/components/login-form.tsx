import { cn } from "@/lib/utils"
import { Head, useForm } from '@inertiajs/react'
import { LoaderCircle, AtSign, KeyRound, Eye, EyeOff, CheckCircle2, XCircle, AlertTriangle, Cloud, Chrome, Github } from 'lucide-react'
import { FormEventHandler, useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import InputError from '@/components/input-error'
import { Checkbox } from '@/components/ui/checkbox'

type LoginForm = {
    email: string;
    password: string;
    remember: boolean;
};

interface LoginProps {
    className?: string;
    status?: string;
    canResetPassword: boolean;
    flash?: {
        message?: string;
        error?: string;
        warning?: string;
    };
}

export function LoginForm({ className, status, canResetPassword, flash, ...props }: LoginProps) {
    const { data, setData, post, processing, errors, reset } = useForm<Required<LoginForm>>({
        email: '',
        password: '',
        remember: false,
    })

    const [showPassword, setShowPassword] = useState(false)

    const submit: FormEventHandler = (e) => {
        e.preventDefault()
        post(route('login'), {
            onFinish: () => reset('password'),
        })
    }

    // Google OAuth
    const handleGoogleLogin = () => {
        window.location.href = route('auth.google')
    }

    const flashMessage = flash?.message || flash?.error || flash?.warning
    const isError = flash?.error
    const isWarning = flash?.warning

    const MessageIcon = isError ? XCircle : isWarning ? AlertTriangle : CheckCircle2
    const messageColor = isError ? "text-red-600" : isWarning ? "text-yellow-700" : "text-green-600"
    const messageBg = isError ? "bg-red-50/70" : isWarning ? "bg-yellow-50/70" : "bg-green-50/70"

    return (
        <div
            className={cn(
                // Responsive container: center, padding, width
                "flex flex-col gap-8 w-full max-w-[95vw] sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl 2xl:max-w-2xl mx-auto px-2 sm:px-4 md:px-8 py-6 sm:py-8 md:py-12",
                className
            )}
            {...props}
        >
            <Head title="ការចុះឈ្មោះ" />
            <Card className="overflow-hidden w-full shadow-2xl shadow-gray-200/50 dark:shadow-black/20 rounded-xl border-none ">
                <CardContent className="p-0">
                    <form className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-7" onSubmit={submit}>

                        {/* Title */}
                        <div className="flex flex-col items-center text-center sm:space-y-4">
                        {/* DIU Logo with cloud animation */}
                        <img
                            src="/images/dis2.png"
                            alt="DIU Logo"
                            className="h-32 w-190 text-blue-600 animate-bounce object-contain"
                        />

                        {/* <h1 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-gray-50">
                            Welcome Back!
                        </h1>

                        <p className="text-xs xs:text-sm sm:text-base md:text-lg text-gray-500 dark:text-gray-400">
                            Log in to your account to continue
                        </p> */}
                        </div>


                        {/* Flash Messages */}
                        {flashMessage && (
                            <div className={cn("flex items-center gap-3 p-3 rounded-lg border", messageBg)}>
                                <MessageIcon className={cn("h-5 w-5", messageColor)} />
                                <span className={cn("text-sm font-medium", messageColor)}>{flashMessage}</span>
                            </div>
                        )}

                        {/* OAuth Buttons */}
                       {/* <div className="space-y-2 sm:space-y-3 flex justify-center"> */}
                        {/* Google */}
                        {/* <Button
                            type="button"
                            variant="outline"
                            className="w-auto h-10 sm:h-11 flex items-center border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 font-semibold transition-all duration-200"
                            onClick={handleGoogleLogin}
                        >
                            <Chrome className="h-4 w-4 " /> ចុះឈ្មោះជាមួយគណនីរបស់សកល
                        </Button>
                        </div> */}
                        {/* Divider */}
                        {/* <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-gray-200 dark:border-gray-700" />
                            </div>
                            <div className="relative flex justify-center text-[9px] xs:text-[10px] sm:text-xs md:text-sm uppercase">
                                <span className="bg-white dark:bg-gray-900 px-2 text-gray-500 dark:text-gray-400 font-medium">Or continue with</span>
                            </div>
                        </div> */}

                        {/* Email */}
                        <div className="grid gap-1.5 sm:gap-2">
                            <Label htmlFor="email" className="font-semibold text-gray-700 dark:text-gray-300">អ៊ីមែល</Label>
                            <div className="relative">
                                <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                                <Input id="email" type="email" required autoFocus autoComplete="email" placeholder="you@example.com" value={data.email} onChange={(e) => setData('email', e.target.value)} className="pl-10 h-9 sm:h-10 border-gray-300 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-50 text-xs sm:text-base" />
                            </div>
                            <InputError message={errors.email} className="mt-1 text-sm text-red-500" />
                        </div>

                        {/* Password */}
                        <div className="grid gap-1.5 sm:gap-2">
                            <div className="flex items-center">
                                <Label htmlFor="password" className="font-semibold text-gray-700 dark:text-gray-300">លេខសំងាត់</Label>
                                {canResetPassword && (
                                    <a href={route('password.request')} className="ml-auto text-xs sm:text-sm text-blue-600 dark:text-blue-400 underline-offset-4 hover:underline transition">Forgot password?</a>
                                )}
                            </div>
                            <div className="relative">
                                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                                <Input id="password" type={showPassword ? "text" : "password"} required autoComplete="current-password" value={data.password} onChange={(e) => setData('password', e.target.value)} className="pl-10 pr-10 h-9 sm:h-10 border-gray-300 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-50 text-xs sm:text-base" />
                                <Button type="button" variant="ghost" size="sm" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" onClick={() => setShowPassword(!showPassword)}>
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                            </div>
                            <InputError message={errors.password} className="mt-1 text-xs sm:text-sm text-red-500" />
                        </div>

                        {/* Remember */}
                        <div className="flex items-center space-x-1.5 sm:space-x-2">
                            <Checkbox id="remember" name="remember" checked={data.remember} onCheckedChange={() => setData('remember', !data.remember)} className="border-gray-300 dark:border-gray-600 data-[state=checked]:bg-blue-600 data-[state=checked]:text-white" />
                            <Label htmlFor="remember" className="text-xs sm:text-base text-gray-700 dark:text-gray-300">ចងចាំការចូល</Label>
                        </div>

                        {/* Submit */}
                        <Button type="submit" className="w-full h-10 sm:h-11 text-sm sm:text-base md:text-lg font-semibold bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 transition-all duration-300 shadow-lg shadow-blue-500/50 dark:shadow-blue-900/50" disabled={processing}>
                            {processing && <LoaderCircle className="h-5 w-5 animate-spin mr-2" />} ចូល
                        </Button>

                        {/* <div className="text-center text-[10px] xs:text-xs sm:text-sm md:text-base text-gray-500 dark:text-gray-400">
                            Don’t have an account? <a href={route('register')} className="font-medium text-blue-600 dark:text-blue-400 underline-offset-4 hover:underline transition">Sign up</a>
                        </div> */}
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
