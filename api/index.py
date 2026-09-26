from backend.app import app


class ApiPrefixMiddleware:
    def __init__(self, application):
        self.application = application

    def __call__(self, environ, start_response):
        path = environ.get("PATH_INFO", "")
        if not path.startswith("/api"):
            environ["PATH_INFO"] = f"/api{path}"
        return self.application(environ, start_response)


app = ApiPrefixMiddleware(app)
