import { CognitoUserPoolEvent } from 'aws-lambda'

export const handler = async (event: CognitoUserPoolEvent): Promise<CognitoUserPoolEvent> => {
  const { 'custom:role': role, email, phone_number: phone } = event.request.userAttributes
  const rolesConfig = JSON.parse(process.env.rolesConfig!)

  let skipConfirmation = false
  const isRoleProvided = role && rolesConfig[role] && Object.keys(rolesConfig).length > 0

  if (isRoleProvided) {
    skipConfirmation = rolesConfig[role].auth?.skipConfirmation ?? false
  }
  event.response.autoConfirmUser = skipConfirmation

  if (email) {
    event.response.autoVerifyEmail = skipConfirmation
  }
  if (phone) {
    event.response.autoVerifyPhone = skipConfirmation
  }
  return event
}
