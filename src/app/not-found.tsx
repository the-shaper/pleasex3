import Link from "next/link";
import Image from "next/image";

export default function NotFound() {
    return (
        <div className="font-space min-h-screen bg-none bg-cover bg-center flex items-center justify-center p-8">
            <div className="max-w-2xl w-full text-center space-y-8">
                {/* Logo */}
                <Image
                    src="/px3-maintitle.svg"
                    alt="Please Please Please"
                    width={870}
                    height={127}
                    className="w-full max-w-[400px] h-auto mx-auto"
                    priority
                />

                {/* 404 Message */}
                <div className="space-y-4">
                    <h1 className="text-8xl font-bold text-coral tracking-tighter">404</h1>
                    <h2 className="text-2xl font-bold text-text uppercase tracking-widest">
                        Page Not Found
                    </h2>
                    <p className="text-text-muted text-sm uppercase tracking-wider">
                        The page you're looking for doesn't exist or has been moved.
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 items-center justify-center flex-col sm:flex-row">
                    <Link
                        href="/"
                        className="bg-coral text-white px-8 py-3 font-bold text-xl uppercase hover:bg-coral/90 transition-colors"
                    >
                        Go to Main
                    </Link>
                    <Link
                        href="/sign-in"
                        className="bg-text text-bg px-8 py-3 font-bold text-xl uppercase hover:bg-text/90 transition-colors"
                    >
                        Sign In
                    </Link>
                </div>
            </div>
        </div>
    );
}
