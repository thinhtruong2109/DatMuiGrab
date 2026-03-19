package dat_mui_grab.datmuigrab.dto.request;

import lombok.Data;

@Data
public class UpdateDriverRequest {
    private String licenseNumber;
    private String idCardNumber;
    private String vehiclePlate;
    private String vehicleType;
    private String vehicleModel;
}
