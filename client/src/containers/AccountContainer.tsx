/**
 * AccountContainer.tsx
 *
 * The account page: change the avatar, change the password. A new avatar is
 * uploaded the moment it is chosen, and the header's copy of the user is
 * updated with the server's answer, so the new picture appears there too.
 */
import { useState } from 'react';
import { Link } from 'react-router';
import { MIN_PASSWORD_LENGTH } from '@wolfie-lists/shared';
import * as api from '@/lib/api';
import { useModals } from '@/context/ModalContext';
import { useSession, useUser } from '@/context/SessionContext';
import AvatarPicker from '@/components/AvatarPicker';
import Form from '@/components/Form';

export default function AccountContainer() {
    const user = useUser();
    const { setUser } = useSession();
    const { inform } = useModals();
    const [isUploading, setIsUploading] = useState(false);

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordChanged, setPasswordChanged] = useState(false);

    async function changeAvatar(file: File) {
        setIsUploading(true);
        try {
            setUser(await api.uploadAvatar(file));
        } catch (error) {
            inform({ title: 'Your Avatar Was Not Saved', message: (error as Error).message });
        } finally {
            setIsUploading(false);
        }
    }

    async function changePassword() {
        setPasswordChanged(false);
        if (newPassword.length < MIN_PASSWORD_LENGTH) {
            throw new Error(`A password must be at least ${MIN_PASSWORD_LENGTH} characters long.`);
        }
        if (newPassword !== confirmPassword) throw new Error('The two new passwords do not match.');

        await api.changePassword(currentPassword, newPassword);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setPasswordChanged(true);
    }

    return (
        <section aria-label="Account">
            <div>
                <Link to="/lists">
                    ← Back to your lists
                </Link>

                <div>
                    <h2>Your Account</h2>
                    <p id="account-email">{user.email}</p>
                    <AvatarPicker user={user} label={isUploading ? 'Uploading…' : 'Change Avatar'}
                                  disabled={isUploading} onChoose={changeAvatar} />
                </div>

                <div>
                    <h2>Change Your Password</h2>
                    <Form id="password-form" onSubmit={changePassword}>
                        <Form.Error />
                        {passwordChanged && (
                            <p role="status">
                                Your password has been changed.
                            </p>
                        )}
                        <Form.Field id="current-password" label="Current Password" type="password"
                                    autoComplete="current-password" value={currentPassword}
                                    onChange={(event) => setCurrentPassword(event.target.value)} />
                        <Form.Field id="new-password" label="New Password" type="password"
                                    autoComplete="new-password" hint={`At least ${MIN_PASSWORD_LENGTH} characters`}
                                    value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
                        <Form.Field id="confirm-new-password" label="Confirm New Password" type="password"
                                    autoComplete="new-password" value={confirmPassword}
                                    onChange={(event) => setConfirmPassword(event.target.value)} />
                        <Form.Submit pendingLabel="Changing…">Change Password</Form.Submit>
                    </Form>
                </div>
            </div>
        </section>
    );
}
