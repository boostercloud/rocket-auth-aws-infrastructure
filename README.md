# Authentication Booster Rocket for AWS

This package is a configurable Booster rocket to add an authentication API based on Cognito to your Booster applications.

- [Usage](https://github.com/boostercloud/rocket-auth-aws-infrastructure#usage)
- [Configuration Options](https://github.com/boostercloud/rocket-auth-aws-infrastructure#configuration-options)
- [Outputs](https://github.com/boostercloud/rocket-auth-aws-infrastructure#outputs)
- [Operations](https://github.com/boostercloud/rocket-auth-aws-infrastructure#operations)
  - [Sign-up](https://github.com/boostercloud/rocket-auth-aws-infrastructure#sign-up)
  - [Confirm Sign-up](https://github.com/boostercloud/rocket-auth-aws-infrastructure#confirm-sign-up)
  - [Resend Sign-up Confirmation Code](https://github.com/boostercloud/rocket-auth-aws-infrastructure#resend-sign-up-confirmation-code)
  - [Sign-in](https://github.com/boostercloud/rocket-auth-aws-infrastructure#sign-in)
  - [Request Passwordless Token](https://github.com/boostercloud/rocket-auth-aws-infrastructure#request-passwordless-token)
  - [Revoke Access Token](https://github.com/boostercloud/rocket-auth-aws-infrastructure#revoke-access-token)
  - [Refresh Access Token](https://github.com/boostercloud/rocket-auth-aws-infrastructure#refresh-access-token)
  - [Request Password Reset](https://github.com/boostercloud/rocket-auth-aws-infrastructure#request-password-reset)
  - [Change Password](https://github.com/boostercloud/rocket-auth-aws-infrastructure#change-password)


## Usage

Install this package as a `devDependency` in your Booster project (It's a `devDependency` because it's only used during deployment, so we don't want this code to be uploaded to the project lambdas)

```sh
npm install --save-dev @boostercloud/rocket-auth-aws-infrastructure
```

In your Booster config file, pass a `RocketDescriptor` array to the `AWS Provider` initializer configuring the aws authentication rocket:

```typescript
import { Booster } from '@boostercloud/framework-core'
import { BoosterConfig } from '@boostercloud/framework-types'
import * as AWS from '@boostercloud/framework-provider-aws'


Booster.configure('production', (config: BoosterConfig): void => {
  config.appName = 'my-store'
  config.providerPackage = '@boostercloud/framework-provider-aws'
  config.rockets = [
    {
      packageName: '@boostercloud/rocket-auth-aws-infrastructure',
      parameters: {         
        mode: 'UserPassword'                     
      },
    },
  ]
})
```

###### Note:
> Make sure that you have defined the suitable roles for your application. Please, check the [Official Booster Documentation](https://github.com/boostercloud/booster/tree/main/docs#authentication-and-authorization) for more information.


## Configuration Options

```typescript
{
  passwordPolicy?: {                         // Optional, all values are set to true by default.
    minLength?: number,                       // Minimum length, which must be at least 6 characters but fewer than 99 character
    requireDigits: boolean,                   // Require numbers
    requireLowercase: boolean,                // Require lowercase letters
    requireSymbols: boolean,                  // Require special characters
    requireUppercase: boolean                // Require uppercase letters
  }
  mode: 'Passwordless' | 'UserPassword'      // If Passwordless, the user must be a phone number. If UserPassword, the user must be a valid email.
}
```


## Outputs

The auth rocket will expose the following base url outputs:

```sh
<appName>.AuthApiURL = https://<httpURL>/production/auth
<appName>.AuthApiIssuer = https://cognito-idp.<app-region>.amazonaws.com/{userPoolId}
<appName>.AuthApiJwksUri = https://cognito-idp.<app-region>.amazonaws.com/{userPoolId}/.well-known/jwks.json
```

| Output             | Description                                                                            |
| ------------------ | -------------------------------------------------------------------------------------- |
| AuthApiURL         | Base Api Url which will exposed all auth endpoints.                                     |
| AuthApiIssuer      | The issuer who sign the JWT tokens.                                                     |
| AuthApiJwksUri     | Uri with all the public keys used to sign the JWT tokens.                               |

The `AuthApiIssuer` and `AuthApiJwksUri` must be used in the `tokenVerifier` Booster config. More information about JWT Configuration [here.](https://github.com/boostercloud/booster/blob/main/docs/chapters/04_features.md#jwt-configuration)


## Operations

### Sign-up

Users can use this endpoint to register in your application and get a role assigned to them.

#### Endpoint

```http request
POST https://<httpURL>/auth/sign-up
```

#### Request body

```json
{
  "username": "string",
  "password": "string",
  "userAttributes": {
    "role": "string"
  }
}
```

| Parameter        | Description                                                                                                                                                                                          |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| _username_       | The username of the user you want to register. It **must be an email in UserPassword mode or an phone number  in Passwordless mode**.                                                                                                                              |
| _password_       | The password the user will use to later login into your application and get access tokens. **Only in UserPassword mode**                                                                                                           |
| _userAttributes_ | Here you can specify the attributes of your user. These are: <br/> -_**role**_: A unique role this user will have. You can only specify here a role where the `signUpOptions` property is not empty.|

#### Response

```json
{
  "id": "cb61c0a4-8f85-4774-88a9-448ce6321eea",
  "username": "+34999999999",
  "userAttributes": {
    "role": "User"
  }
}
```

#### Errors

You will get an HTTP status code different from 2XX and a body with a message telling you the reason of the error.

Example of an account with the given username which already exists:

```json
{
  "error": {
    "type": "UsernameExistsException",
    "message": "An account with the given phone_number already exists."
  }
}
```

You will get an HTTP status code different from 2XX and a body with a message telling you the reason of the error.


### Confirm Sign-up

Whenever a User signs up with their phone number in `Passwordless` mode, an SMS message will be sent with a confirmation code. If you're using a `UserPassword` mode an email with a confirmation link will be sent.
They will need to provide this code to confirm registation by calling the`sign-up/confirm` endpoint

#### Endpoint

```http request
POST https://<httpURL>/auth/sign-up/confirm
```

#### Request body

```json
{
  "confirmationCode": "string",
  "username": "string"
}
```

| Parameter          | Description                                                                            |
| ------------------ | -------------------------------------------------------------------------------------- |
| _confirmationCode_ | The confirmation code received in the SMS message.                                     |
| _username_         | The username of the user you want to sign in. They must have previously signed up.     |

#### Response

```json
{
  "message": "The username: +34999999999 has been confirmed."
}
```

#### Errors

You will get an HTTP status code different from 2XX and a body with a message telling you the reason of the error.
Common errors would be like submitting an expired confirmation code or a non valid one.

Example of an invalid verification code:

```json
{
  "error": {
    "type": "CodeMismatchException",
    "message": "Invalid verification code provided, please try again."
  }
}
```


### Resend Sign-up Confirmation Code

If for some reason the confirmation code never reaches your email, or your phone via SMS, you can ask the API to resend a new one.

#### Endpoint

```http request
POST https://<httpURL>/auth/sign-up/resend-code
```

#### Request body

```json
{
  "username": "string"
}
```

| Parameter          | Description                                                                            |
| ------------------ | -------------------------------------------------------------------------------------- |
| _username_         | The username of the user you want to sign in. They must have previously signed up.     |

#### Response

```json
{
  "message": "The confirmation code to activate your account has been sent to: +34999999999."
}
```

#### Errors

You will get an HTTP status code different from 2XX and a body with a message telling you the reason of the error.
Common errors would be like submitting an expired confirmation code or a non valid one.


### Sign-in

This endpoint creates a session for an already registered user, returning an access token that can be used to access role-protected resources

#### Endpoint

```http request
POST https://<httpURL>/auth/sign-in
```

#### Request body

```json
{
  "username": "string",
  "password": "string"
}
```

| Parameter  | Description                                                                            |
| ---------- | -------------------------------------------------------------------------------------- |
| _username_ | The username of the user you want to sign in. They must have previously signed up.     |
| _password_ | The password used to sign up the user. **Only in UserPassword mode**                                                  |

#### Response

UserPassword:

```json
{
  "accessToken": "string",
  "expiresIn": "string",
  "refreshToken": "string",
  "tokenType": "string"
}
```

| Parameter      | Description                                                                                                                          |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| _accessToken_  | The token you can use to finish de session.|
| _tokenId_      | The token you can use to access restricted resources. It must be sent in the `Authorization` header (prefixed with the `tokenType`). |
| _expiresIn_    | The period of time, in seconds, after which the token will expire.                                                                   |
| _refreshToken_ | The token you can use to get a new access token after it has expired.                                                                |
| _tokenType_    | The type of token used. It is always `Bearer`.                                                                                       |

Passwordless:

```json
{
  "session": "string",
  "message": "string"
}
````

| Parameter      | Description                                                                                                                          |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| session    | The type of token used. It is always `Bearer`.                                                                                       |
| _message_    | Message with the next steps. It is always: `Use the session and the code we have sent you via SMS to get your access tokens via POST /token.`.  |                                                                                     |


### Request Passwordless Token

Call this endpoint to get the access token for Passwordless mode:

#### Endpoint

```http request
POST https://<httpURL>/auth/token
```

#### Request body

```json
{
  "username": "string",
  "session": "string",
  "confirmationCode": "string"
}
```

| Parameter  | Description                                                                            |
| ---------- | -------------------------------------------------------------------------------------- |
| _username_ | The phone number of the user you want to sign in. They must have previously signed up. |
| _session_  | The session obtained in the sign in response.                                          |
| _confirmationCode_  | The confirmation code received in the SMS message after sign in.              |

#### Response

```json
{
  "accessToken": "string",
  "expiresIn": "string",
  "refreshToken": "string",
  "tokenType": "string"
}
```

#### Errors

You will get an HTTP status code different from 2XX and a body with a message telling you the reason of the error.

Example: Login of a user that has not been confirmed

```json
{
  "error": {
    "type": "UserNotConfirmedException",
    "message": "User is not confirmed.."
  }
}
```


### Revoke Access Token

Users can call this endpoint to finish the session before token expires.

#### Endpoint

```http request
POST https://<httpURL>/auth/token/revoke
```

#### Request body

```json
{
  "accessToken": "string"
}
```

| Parameter     | Description                                   |
| ------------- | --------------------------------------------- |
| _accessToken_ | The access token you get in the sign-in process. |

#### Response

```json
{
  "message": "string"
}
```

| Parameter     | Description                                   |
| ------------- | --------------------------------------------- |
| _message_ | Message with sign out confirmation. It is always: `Signed out` |


#### Errors

You will get an HTTP status code different from 2XX and a body with a message telling you the reason of the error.

Example: Invalid access token specified

```json
{
  "error": {
    "type": "NotAuthorizedException",
    "message": "Invalid Access Token"
  }
}
```


### Refresh Access Token

Users can call this endpoint to refresh the access token.

#### Endpoint

```http request
POST https://<httpURL>/auth/token/refresh
```

#### Request body

> Refresh-token request body

```json
{
  "refreshToken": "string"
}
```

| Parameter      | Description                                                                            |
| -------------- | -------------------------------------------------------------------------------------- |
| _refreshToken_ | The token you can use to get a new access token after it has expired.                  |

#### Response

```json
{
  "accessToken": "string",
  "expiresIn": "string",
  "refreshToken": "string",
  "tokenType": "string"
}
```

#### Errors

Refresh token error response body example: Invalid refresh token specified

```json
{
  "error": {
    "type": "NotAuthorizedException",
    "message": "Invalid Refresh Token"
  }
}
```

You will get a HTTP status code different from 2XX and a body with a message telling you the reason of the error.


### Request Password Reset

In case the password is forgotten, users can initiate the password change process through this endpoint.

#### Endpoint

```http request
POST https://<httpURL>/auth/password/forgot
```

#### Request body

```json
{
  "username": "string"
}
```

| Parameter     | Description                                   |
| ------------- | --------------------------------------------- |
| _username_    | The username of the user whose password you want to change. They must have previously signed up. |

#### Response

```json
{
  "message": "string"
}
```

| Parameter     | Description                                   |
| ------------- | --------------------------------------------- |
| _message_     | Confirmation message. It is always: `"The confirmation code to change your password has been sent to: [USER_EMAIL]."` |


#### Errors

You will get an HTTP status code different from 2XX and a body with a message telling you the reason of the error.

Example: User not found.

```json
{
  "error": {
    "type": "UserNotFoundException",
    "message": "Username/client id combination not found."
  }
}
```


### Change Password

Using the code obtained from the email sent by the forgot password endpoint, users can change their password.

#### Endpoint

```http request
POST https://<httpURL>/auth/password/change
```

#### Request body

```json
{
  "username": "string",
  "password": "string",
  "confirmationCode": "string"
}
```

| Parameter  | Description                                                                            |
| ---------- | -------------------------------------------------------------------------------------- |
| _username_ | The username of the user you want to change the password. They must have signed up previously. |
| _password_  | The new password for sign in.                                          |
| _confirmationCode_  | The confirmation code received in the user's email.              |

#### Response

```json
{
  "message": "string"
}
```

| Parameter     | Description                                   |
| ------------- | --------------------------------------------- |
| _message_     | Confirmation Message. It is always: `"Your password has been successfully changed."` |


#### Errors

You will get an HTTP status code different from 2XX and a body with a message telling you the reason of the error.

Example: Confirmation Code is missing.

```json
{
  "error": {
    "type": "MissingRequiredParameter",
    "message": "Missing required key 'ConfirmationCode' in params"
  }
}
```
