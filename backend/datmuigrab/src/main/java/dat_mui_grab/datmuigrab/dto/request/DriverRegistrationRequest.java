package dat_mui_grab.datmuigrab.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class DriverRegistrationRequest {

    @NotNull
    private UUID companyId;

    @NotBlank
    private String licenseNumber;

    @NotBlank
    private String idCardNumber;

    @NotBlank
    private String phoneNumber;

    @NotBlank
    private String vehiclePlate;

    private String vehicleType;
    private String vehicleModel;
}
