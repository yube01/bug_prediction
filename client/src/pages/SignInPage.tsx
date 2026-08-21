import SignInForm from '@/components/website/auth/SigninForm'
import Navbar from '@/components/website/Navbar'

export default function SignInPage() {

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <Navbar />
      <div className="flex-1 flex justify-center items-center px-5 py-12">
        <SignInForm />
      </div>
    </div>
  )
}
