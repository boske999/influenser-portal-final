// Script to check Supabase storage buckets
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://fbmdbvijfufsjpsuorxi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZibWRidmlqZnVmc2pwc3VvcnhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUwOTI3NjksImV4cCI6MjA2MDY2ODc2OX0.WpbyAQo8HyoMW1YWGM24MX22rmFth49Zjq17JMAwfGo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkBuckets() {
  try {
    console.log('Checking Supabase storage buckets...');
    const { data, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('Error listing buckets:', error);
      return;
    }
    
    console.log('Available buckets:');
    data.forEach(bucket => {
      console.log(`- ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
    });
    
    // Check if rich-text bucket exists
    const richTextBucket = data.find(b => b.name === 'rich-text');
    if (richTextBucket) {
      console.log('\n✅ rich-text bucket exists!');
      return false; // Bucket already exists
    } else {
      console.log('\n❌ rich-text bucket does NOT exist!');
      return true; // Bucket needs to be created
    }
    
  } catch (err) {
    console.error('Unexpected error:', err);
    return false;
  }
}

// Add code to create the bucket if it doesn't exist
async function createRichTextBucket() {
  try {
    console.log('Creating rich-text bucket...');
    const { data, error } = await supabase.storage.createBucket('rich-text', {
      public: true,
    });
    
    if (error) {
      console.error('Error creating bucket:', error);
      return false;
    }
    
    console.log('✅ rich-text bucket created successfully!');
    console.log('Now the rich text editor should work correctly.');
    return true;
  } catch (err) {
    console.error('Unexpected error:', err);
    return false;
  }
}

// Run the check and create if needed
async function main() {
  const needsCreation = await checkBuckets();
  if (needsCreation) {
    await createRichTextBucket();
  }
}

main(); 