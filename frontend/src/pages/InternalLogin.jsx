import Form from "../components/Form";

function InternalLogin() {
    return (
        <Form
            route="/api/user/applicant/login/"
            method="login"
            portal="internal"
            requireInternal
        />
    );
}

export default InternalLogin;
