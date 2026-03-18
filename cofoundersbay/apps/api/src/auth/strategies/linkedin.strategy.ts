import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-linkedin-oauth2';

export interface LinkedInProfile {
  id: string;
  email: string;
  displayName: string;
  firstName: string;
  lastName: string;
  picture?: string;
}

@Injectable()
export class LinkedInStrategy extends PassportStrategy(Strategy, 'linkedin') {
  constructor(private readonly config: ConfigService) {
    const clientID = config.get<string>('LINKEDIN_CLIENT_ID');
    const clientSecret = config.get<string>('LINKEDIN_CLIENT_SECRET');
    const callbackURL = config.get<string>('LINKEDIN_CALLBACK_URL') || 'http://localhost:3001/api/auth/linkedin/callback';

    super({
      clientID: clientID || 'not-configured',
      clientSecret: clientSecret || 'not-configured',
      callbackURL,
      scope: ['r_emailaddress', 'r_liteprofile'],
      passReqToCallback: false,
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: (err: any, user?: any) => void,
  ): Promise<void> {
    const { id, emails, displayName, name, photos } = profile;
    
    const linkedInProfile: LinkedInProfile = {
      id,
      email: emails?.[0]?.value || '',
      displayName: displayName || '',
      firstName: name?.givenName || '',
      lastName: name?.familyName || '',
      picture: photos?.[0]?.value,
    };

    done(null, linkedInProfile);
  }
}
