
import { supabase } from '@/integrations/supabase/client';

// Enhanced profile creation function with better error handling and retry logic
export const ensureProfileExists = async (userId: string, userData?: any) => {
  try {
    console.log('Ensuring profile exists for user:', userId, userData);
    
    // First check if profile already exists
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('id, email, first_name, last_name')
      .eq('id', userId)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking profile:', checkError);
      // Continue to try creating profile even if check fails
    }

    if (existingProfile) {
      console.log('Profile already exists for user:', userId, existingProfile);
      return;
    }

    // Extract user data from various sources with comprehensive fallbacks
    const email = userData?.email || userData?.user_metadata?.email || null;
    const firstName = userData?.first_name || userData?.user_metadata?.first_name || null;
    const lastName = userData?.last_name || userData?.user_metadata?.last_name || null;

    console.log('Creating profile with data:', { userId, email, firstName, lastName });

    // Create profile with extracted data
    const profileData = {
      id: userId,
      email: email || '',
      first_name: firstName || '',
      last_name: lastName || '',
    };

    const { error: insertError } = await supabase
      .from('profiles')
      .insert(profileData);

    if (insertError) {
      console.error('Error creating profile:', insertError);
      
      // If it's a conflict error, try to update instead
      if (insertError.code === '23505') {
        console.log('Profile conflict detected, trying to update instead...');
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            email: email || '',
            first_name: firstName || '',
            last_name: lastName || '',
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);

        if (updateError) {
          console.error('Error updating profile after conflict:', updateError);
        } else {
          console.log('Profile updated successfully after conflict for user:', userId);
        }
      }
    } else {
      console.log('Profile created successfully for user:', userId);
    }
  } catch (error) {
    console.error('Unexpected error in ensureProfileExists:', error);
  }
};
