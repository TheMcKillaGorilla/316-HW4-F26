/**
 * AvatarPicker.tsx
 *
 * The avatar as it is now (or will be), and a button to choose an image file.
 * Used by both the sign up form and the account page, which differ only in
 * what they do with the file once it is chosen.
 */
import { useEffect, useState, type ChangeEvent } from 'react';
import type { UserDTO } from '@wolfie-lists/shared';
import { avatarFileProblem } from '@/lib/avatarFile';
import Avatar from './Avatar';

interface AvatarPickerProps {
    /** whose avatar is shown until a file is chosen */
    user: Pick<UserDTO, 'email' | 'avatarUrl'>;
    label: string;
    disabled?: boolean;
    onChoose: (file: File) => void;
}

export default function AvatarPicker({ user, label, disabled = false, onChoose }: AvatarPickerProps) {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [problem, setProblem] = useState<string | null>(null);

    // a preview URL holds the file in memory until it is revoked
    useEffect(() => () => {
        if (previewUrl !== null) URL.revokeObjectURL(previewUrl);
    }, [previewUrl]);

    function handleChange(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        event.target.value = '';  // so choosing the same file again still counts
        if (file === undefined) return;

        const found = avatarFileProblem(file);
        setProblem(found);
        if (found !== null) return;

        setPreviewUrl(URL.createObjectURL(file));
        onChoose(file);
    }

    return (
        <div>
            <Avatar user={{ email: user.email || '?', avatarUrl: previewUrl ?? user.avatarUrl }} size={4.5}
                    className="shadow-card" />
            <div>
                <label>
                    {label}
                    <input id="avatar-input" type="file" accept="image/png,image/jpeg,image/webp"
                           disabled={disabled} onChange={handleChange} className="sr-only" />
                </label>
                <span>PNG, JPEG or WebP, under 1 MB</span>
                {problem && <span role="alert" className="text-[0.875rem] text-sbu-red">{problem}</span>}
            </div>
        </div>
    );
}
