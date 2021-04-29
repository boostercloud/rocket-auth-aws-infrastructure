#!/bin/bash

# $1 -> userPoolId
# $2 -> username (email)
# $3 -> password
# $4 -> role

aws cognito-idp admin-create-user \
  --user-pool-id $1 \
  --username $2 \
  --temporary-password "1234!abC@" \
  --message-action "SUPPRESS" \
  --user-attributes Name="custom:role",Value=$4 Name="email",Value=$2 Name="email_verified",Value="True"


aws cognito-idp admin-set-user-password \
  --user-pool-id $1 \
  --username $2 \
  --password $3 \
  --permanent