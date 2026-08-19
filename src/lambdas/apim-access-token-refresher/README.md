# Refresh APIM Access Tokens Lambda

We store an access token for the APIM applications in SSM Parameter Store for shared access.

Access Tokens for APIM applications have a lifespan of 10 minutes. Every 9 minutes, this Lambda function will be invoked by a EventBridge scheduled event to refresh the access token stored in SSM.

The integration follows the instructions [found here](https://digital.nhs.uk/developer/guides-and-documentation/security-and-authorisation/application-restricted-restful-apis-signed-jwt-authentication#step-1-create-an-application).

It will do the following:

- Read all of the private keys uploaded to SSM Parameter Store with the path prefix `/comms/{ENVIRONMENT}/pds/keys` (these are created by the KeyGen Lambda).
- It will figure out the youngest key using the key name, and use this key to sign a JWT.
- This JWT is sent to the PDS authorization server and exchanged for an access token with a lifespan of 10 minutes.
- This token is uploaded to SSM Parameter store with the name `/comms/{ENVIRONMENT}/apim/access-token`.

## Setup instructions

Each environment will need an application creating through the [NHS Developer Portal](https://onboarding.prod.api.platform.nhs.uk/MyApplications) (including dynamic environments).

Once you have an environment created, you will need to do the following:

- Enable the relevant API for your application (e.g. PDS FHIR API)
- Store your application API key in SSM Parameter store (`/comms/<ENVIRONMENT_NAME>/apim/api-key`)
- Configure to use your environment's JWKS file (ideally using the public endpoint, don't upload a static file).

## Access token data

The access token data stored in SSM has the following structure:

```json
{
  "access_token": "the access token",
  "expires_at": 0, // "unix timestamp (in seconds) at which the access token will expire",
  "token_type": "Bearer"
}
```

## CLI

The application is also exposed via a CLI which is useful for local testing. The entrypoint for this is at `src/apis/cli.ts`.

Ensure you have the following environment variables set:

- `APIM_AUTH_TOKEN_URL`
- `APIM_ACCESS_TOKEN_SSM_PARAMETER_NAME`
- `APIM_API_KEY_SSM_PARAMETER_NAME`
- `APIM_PRIVATE_KEY_SSM_PARAMETER_NAME`

Then run `pnpm run cli`.
