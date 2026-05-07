# Environment Variables Setup

## Required for Basic Functionality
```env
MONGODB_URI=mongodb://localhost:27017/aurakriti
JWT_SECRET=your-super-secret-jwt-key-here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Email Configuration (Optional - Development Bypass Available)
```env
# Gmail SMTP (Recommended for development)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
FROM_EMAIL=your-email@gmail.com
FROM_NAME=Aurakriti
```

## Cloudinary (For Image Upload)
```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
CLOUDINARY_FOLDER=aurakriti
```

## Razorpay (For Payments)
```env
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret
```

## AI Features (Optional)
```env
HUGGINGFACE_API_KEY=your-huggingface-api-key
```

## Development Notes

### Email Setup
If you don't configure email settings in development, the system will automatically:
- Auto-verify new user accounts
- Skip OTP email sending
- Allow immediate login after registration

### Gmail App Password
1. Enable 2-factor authentication on your Gmail account
2. Go to Google Account settings → Security → App passwords
3. Generate a new app password for "Aurakriti"
4. Use that password as EMAIL_PASS

### MongoDB
Make sure MongoDB is running locally or you have a MongoDB Atlas connection string.
