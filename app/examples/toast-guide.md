# Toast Alert System Guide

## Overview

This project uses a custom toast alert system built on top of `react-hot-toast` and styled to match the application's design. The toast alerts automatically show for notifications from the backend, and can also be triggered programmatically for frontend messages.

## Toast Types

There are 4 main types of toast alerts:

1. **Info** - Blue styling, used for general information
2. **Success** - Green styling, used for successful operations
3. **Warning** - Amber styling, used for warnings
4. **Error** - Red styling, used for errors

## Using Toast Alerts

### Automatic Toasts for Notifications

Notifications from your backend will automatically be displayed as toast alerts when they are received. This is handled by the `ToastProvider` component that listens to the notification context.

### Manual Toast Alerts

To show toast alerts manually in your components, use the `AlertUtils` helper:

```tsx
import AlertUtils from '../components/AlertUtils';

// In your component:
function handleSubmit() {
  try {
    // Your logic here
    AlertUtils.success('Success', 'Your changes have been saved');
  } catch (error) {
    AlertUtils.error('Error', 'Failed to save changes');
  }
}
```

### Available Methods

```tsx
// Information toast
AlertUtils.info('Title', 'Your message here');

// Success toast
AlertUtils.success('Success', 'Operation completed successfully');

// Warning toast
AlertUtils.warning('Warning', 'This action cannot be undone');

// Error toast
AlertUtils.error('Error', 'Something went wrong');
```

## Customization

If you need to customize the toast alerts further, you can modify:

- `components/ToastProvider.tsx` - For the automatic notification toasts
- `components/AlertUtils.tsx` - For the programmatic toast methods

## Implementation Details

1. **ToastProvider** - Automatically shows toast alerts when notifications are received
2. **AlertUtils** - Utility functions for programmatically showing toast alerts
3. **react-hot-toast** - The underlying toast library

## Example

Visit the [Toast Demo](/examples/toast-demo) page to see all toast types in action. 