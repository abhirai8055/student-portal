# student-portal

# Features
- Student Management:

CRUD operations for student profiles.
OTP-based verification.

- Application Management:

Submit applications.
Update application statuses with email notifications.

-Authentication:

JWT-based authentication.
Role-based access for students and admins.
Notifications:

Email alerts for status changes and application submissions.



# Setup Instructions

-Clone the Repository:


git clone <https://github.com/abhirai8055/student-portal.git>
cd <student-portal>

- Install Dependencies:
npm install

# Environment Configuration:
Create a .env file in the root directory and include the following variables:
PORT=3000
MONGO_URI=<your-mongodb-connection-string>
JWT_SECRET=<your-secret-key>
EMAIL_SERVICE=<email-service-provider>
EMAIL_USER=<your-email-address>
EMAIL_PASSWORD=<your-email-password>


Start Server:

npm start


postman Collection
#### Import Postman Collection
- Download the `docs/thunder-collection_postman_student portal.json` file from the `docs` folder in this repository.
- Open Postman and go to the **Collections** tab.
- Click on the **Import** button.
- Upload the JSON file to import all API endpoints into Postman.

