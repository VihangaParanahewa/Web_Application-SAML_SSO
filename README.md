# Web_Application-SAML_SSO
web application implemented using WSO2 products with SAMAL SSO

## Install

Execute the following command from the root folder to install all necessary dependencies

```shell
npm install
```

## Configure

### Express Application

Create a `.env` file in the root directory and enter the following properties

> Change the `SAML_ENTRYPOINT` and `SAML_LOGOUTURL` if the ip-address and ports are different from default configurations

```env
SESSION_SECRET="a well secured secret"

SAML_ENTRYPOINT="https://localhost:9443/samlsso"

# for tenant-specific Service Providers append the tenant domain: HealthFirstHospitalWebApp@foo.com
SAML_ISSUER="HealthFirstHospitalWebApp"
SAML_PROTOCOL="http://"
SAML_LOGOUTURL="https://localhost:9443/samlsso"

WSO2_ROLE_CLAIM="http://wso2.org/claims/role"
WSO2_EMAIL_CLAIM="http://wso2.org/claims/emailaddress"

COMMON_TOKEN=""
DOCTOR_ONLY_TOKEN=""
ADMIN_ONLY_TOKEN=""

CLIENT_ID="your_client_id"
CLIENT_SECRET="your_secret_id"

COMMON_SCOPE="common"
ADMIN_ONLY_SCOPE="adminOnly"
DOCTOR_ONLY_SCOPE="doctorOnly"
```

## Run

Use the following command to start the express application

```shell
nodemon
```

navigate to [http://localhost:3000](http://localhost:3000/app)

