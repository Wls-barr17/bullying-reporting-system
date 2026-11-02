package edu.umb.bullyblock.common;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice
public class ApiExceptionHandler {
    @ExceptionHandler(AuthenticationException.class)
    ProblemDetail authentication() {
        var detail = ProblemDetail.forStatus(HttpStatus.UNAUTHORIZED);
        detail.setTitle("Credenciales inválidas");
        detail.setDetail("Revisa tu correo y contraseña e inténtalo de nuevo.");
        return detail;
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ProblemDetail validation(MethodArgumentNotValidException exception) {
        var detail = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
        detail.setTitle("Solicitud inválida");
        detail.setDetail(exception.getBindingResult().getFieldErrors().stream()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .findFirst().orElse("Revisa los datos enviados."));
        return detail;
    }

    @ExceptionHandler(ResponseStatusException.class)
    ProblemDetail status(ResponseStatusException exception) {
        var detail = ProblemDetail.forStatusAndDetail(exception.getStatusCode(),
                exception.getReason() == null ? "No fue posible completar la solicitud." : exception.getReason());
        detail.setTitle("Solicitud no completada");
        return detail;
    }

    @ExceptionHandler(AccessDeniedException.class)
    ProblemDetail denied() {
        var detail = ProblemDetail.forStatus(HttpStatus.FORBIDDEN);
        detail.setTitle("Acceso denegado");
        detail.setDetail("No tienes permisos para realizar esta acción.");
        return detail;
    }
}
