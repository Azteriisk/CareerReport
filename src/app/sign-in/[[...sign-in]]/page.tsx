import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div 
      className="flex-center" 
      style={{
        minHeight: 'calc(100vh - 82px)',
        background: 'var(--bg-color)',
        padding: '2rem 1rem'
      }}
    >
      <SignIn path="/sign-in" />
    </div>
  );
}
