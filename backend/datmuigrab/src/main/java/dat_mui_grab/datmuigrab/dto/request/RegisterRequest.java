package dat_mui_grab.datmuigrab.dto.request;

import dat_mui_grab.datmuigrab.entity.enums.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {

    @NotBlank
    @Email
    private String email;

    @NotBlank
    @Size(min = 8)
    private String password;

    @NotBlank
    private String fullName;

    private String phoneNumber;

    @NotNull
    private UserRole role;
}
