import SignUpForm from '@/components/website/auth/SignupForm'
import Navbar from '@/components/website/Navbar'

export default function SignUpPage() {

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <Navbar />
      <div className="flex-1 flex justify-center items-center px-5 py-12">
        <SignUpForm />
      </div>
    </div>
  )
}
