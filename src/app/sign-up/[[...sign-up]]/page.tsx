import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div 
      className="flex-center" 
      style={{
        minHeight: 'calc(100vh - 82px)',
        background: 'var(--bg-color)',
        padding: '2rem 1rem'
      }}
    >
      <SignUp path="/sign-up" />
    </div>
  );
}
