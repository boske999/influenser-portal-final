-- Function to send emails using Supabase's built-in email service
-- This leverages the pg_net extension to make HTTP requests to the SendGrid API
-- Make sure pg_net is enabled in your Supabase project

-- First, let's create the function
CREATE OR REPLACE FUNCTION send_email(to_email TEXT, subject TEXT, html_content TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with the privileges of the function creator
AS $$
DECLARE
  sendgrid_api_key TEXT := current_setting('app.settings.sendgrid_api_key', true);
  sendgrid_url TEXT := 'https://api.sendgrid.com/v3/mail/send';
  from_email TEXT := current_setting('app.settings.from_email', true);
  from_name TEXT := current_setting('app.settings.from_name', true);
  request_id BIGINT;
  response JSONB;
BEGIN
  -- Check if required settings are available
  IF sendgrid_api_key IS NULL THEN
    RETURN jsonb_build_object(
      'error', 'SendGrid API key not configured',
      'details', 'Set app.settings.sendgrid_api_key in Supabase dashboard'
    );
  END IF;
  
  IF from_email IS NULL THEN
    from_email := 'noreply@example.com'; -- Fallback default
  END IF;
  
  IF from_name IS NULL THEN
    from_name := 'No Reply'; -- Fallback default
  END IF;
  
  -- Make HTTP request to SendGrid API
  SELECT
    net.http_post(
      url := sendgrid_url,
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || sendgrid_api_key,
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object(
        'personalizations', jsonb_build_array(
          jsonb_build_object(
            'to', jsonb_build_array(
              jsonb_build_object(
                'email', to_email
              )
            ),
            'subject', subject
          )
        ),
        'from', jsonb_build_object(
          'email', from_email,
          'name', from_name
        ),
        'content', jsonb_build_array(
          jsonb_build_object(
            'type', 'text/html',
            'value', html_content
          )
        )
      )
    ) INTO request_id;
  
  -- Wait for response (with timeout)
  SELECT
    status_code,
    response_body
  INTO response
  FROM net.http_get_async(request_id)
  WHERE id = request_id;
  
  -- Return the response
  RETURN jsonb_build_object(
    'success', response->>'status_code' = '202',
    'status_code', response->>'status_code',
    'details', response->>'response_body'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', 'Failed to send email',
      'details', SQLERRM
    );
END;
$$;

-- Grant usage permissions
GRANT EXECUTE ON FUNCTION send_email TO authenticated;
GRANT EXECUTE ON FUNCTION send_email TO service_role;

-- Set up documentation comment
COMMENT ON FUNCTION send_email IS 'Function to send emails using SendGrid API';

-- Instructions for setting up required parameters in Supabase dashboard:
/*
To set the required parameters in Supabase:

1. Go to the Supabase dashboard
2. Navigate to SQL Editor
3. Run the following SQL to set up the required parameters:

ALTER SYSTEM SET app.settings.sendgrid_api_key = 'your_sendgrid_api_key_here';
ALTER SYSTEM SET app.settings.from_email = 'your_from_email@example.com';
ALTER SYSTEM SET app.settings.from_name = 'Your Sender Name';

4. Restart your Supabase project for the changes to take effect
*/ 