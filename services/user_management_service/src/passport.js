require('dotenv').config();
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const JWT_SECRET = process.env.JWT_SECRET;

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: 'http://localhost:3000/api/users/auth/google/callback',
    },
    (accessToken, refreshToken, profile, done) => {
      // Εδώ μπορείς να δημιουργήσεις ή να βρεις χρήστη
      const user = {
        id: profile.id,
        username: profile.displayName,
        email: profile.emails[0].value,
        role: 'student' // ή instructor αν το θες
      };
      return done(null, user);
    }
  )
);
