import Form from "../components/Form";

function Login () {
    return (
        <Form route="/api/user/applicant/login/" method="login" portal="applicant" />
    )
}

export default Login