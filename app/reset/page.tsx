'use client'

import { useState } from 'react';
import { TitledTextInput } from '../ui/TextInput';
import { PillButton } from '../ui/button';
import { resetPassword } from '../actions/auth';

export default function ResetPage() {

    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    const handleReset = async () => {
        setLoading(true);
        setMessage(null);
        const accountEmail: string = username;
        const result = await resetPassword(accountEmail);

        setLoading(false);
        
        if (result === true) {
            setMessage({ text: 'Password reset link sent to your email', type: 'success' });
        } else {
            setMessage({ text: 'Failed to send reset link', type: 'error' });
        }
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            
            <div className='center text-bold'>
                RESET PASSWORD
            </div>

            <div className="w-full max-w-lg p-4">
                <TitledTextInput                    
                    className={"mb-4"}
                    title={"Username"}
                    type={"text"}
                    placeholder={"Email"}
                    onChange={(e) => setUsername(e.target.value)}
                />

                {message && (
                    <div className={`mb-4 p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {message.text}
                    </div>
                )}

            </div>

            <PillButton
                type="submit"
                className={"rounded-3xl mb-8"}
                onClick={handleReset}
                disabled={loading}
            >
                {loading ? "Sending..." : 'RESET'}
            </PillButton>

            <div className='underline cursor-pointer'>
                <a href="/">Go back</a>
            </div>
            
        </div>
    )
}