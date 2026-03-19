package dat_mui_grab.datmuigrab.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class BookRideRequest {

    @NotNull
    private UUID companyId;

    @NotNull
    private BigDecimal pickupLat;

    @NotNull
    private BigDecimal pickupLng;

    @NotBlank
    private String pickupAddress;

    @NotNull
    private BigDecimal destinationLat;

    @NotNull
    private BigDecimal destinationLng;

    @NotBlank
    private String destinationAddress;
}
