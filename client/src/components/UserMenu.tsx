import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { LogOut, User, Settings, Loader2, Trash2, Key, Shield } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';

const UserMenu: React.FC = () => {
  const { user, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  if (!user) {
    return null;
  }

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setSigningOut(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword || deleteConfirmText !== 'DELETE') {
      alert('Please enter your password and type "DELETE" to confirm.');
      return;
    }

    setDeleting(true);
    try {
      // Get the auth token from Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      const authToken = session?.access_token;

      if (!authToken) {
        alert('Authentication error. Please try logging in again.');
        return;
      }

      const response = await fetch('/api/delete-account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ password: deletePassword }),
      });

      if (response.ok) {
        alert('Your account has been successfully deleted.');
        // Force logout and redirect
        await signOut();
      } else {
        const errorData = await response.json();
        alert(`Failed to delete account: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Delete account error:', error);
      alert('An error occurred while deleting your account. Please try again.');
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
      setDeletePassword('');
      setDeleteConfirmText('');
    }
  };

  const userInitials = user.email
    ? user.email.split('@')[0].slice(0, 2).toUpperCase()
    : 'U';

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="relative h-10 w-10 rounded-full border-2 border-blue-200 hover:border-blue-300"
          >
            <Avatar className="h-9 w-9">
              <AvatarImage src={user.user_metadata?.avatar_url} alt={user.email || 'User'} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm font-semibold">
                {userInitials}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 bg-white border border-gray-200 shadow-lg" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none text-gray-900">
              {user.user_metadata?.full_name || 'User'}
            </p>
            <p className="text-xs leading-none text-gray-600">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer text-gray-900 hover:bg-gray-50">
          <User className="mr-2 h-4 w-4 text-gray-600" />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer text-gray-900 hover:bg-gray-50">
          <Settings className="mr-2 h-4 w-4 text-gray-600" />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer text-gray-900 hover:bg-gray-50">
          <Key className="mr-2 h-4 w-4 text-gray-600" />
          <span>Change Password</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer text-gray-900 hover:bg-gray-50">
          <Shield className="mr-2 h-4 w-4 text-gray-600" />
          <span>Privacy & Security</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          className="cursor-pointer text-red-600 hover:bg-red-50 focus:text-red-600"
          onClick={() => setShowDeleteDialog(true)}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          <span>Delete Account</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          className="cursor-pointer text-gray-900 hover:bg-gray-50"
          onClick={handleSignOut}
          disabled={signingOut}
        >
          {signingOut ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin text-gray-600" />
          ) : (
            <LogOut className="mr-2 h-4 w-4 text-gray-600" />
          )}
          <span>{signingOut ? 'Signing out...' : 'Sign out'}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

    {/* Account Deletion Confirmation Dialog */}
    <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
      <AlertDialogContent className="max-w-md bg-white border border-gray-200 shadow-xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-red-600">Delete Account</AlertDialogTitle>
          <AlertDialogDescription className="space-y-4 text-gray-900">
            <p>
              <strong>This action cannot be undone.</strong> This will permanently delete your account and remove all your data from our servers.
            </p>
            <p>All of the following will be permanently deleted:</p>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
              <li>Your profile and account information</li>
              <li>All your uploaded photos</li>
              <li>Your calendar events and schedules</li>
              <li>All app data and preferences</li>
            </ul>
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="delete-password" className="text-gray-900 font-medium">Enter your password to confirm:</Label>
            <Input
              id="delete-password"
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              placeholder="Your current password"
              className="mt-1 bg-white border-gray-300 text-gray-900"
            />
          </div>
          
          <div>
            <Label htmlFor="delete-confirm" className="text-gray-900 font-medium">Type "DELETE" to confirm:</Label>
            <Input
              id="delete-confirm"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type DELETE here"
              className="mt-1 bg-white border-gray-300 text-gray-900"
            />
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel 
            onClick={() => {
              setDeletePassword('');
              setDeleteConfirmText('');
            }}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDeleteAccount}
            disabled={deleting || !deletePassword || deleteConfirmText !== 'DELETE'}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {deleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete Account'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
};

export default UserMenu; 