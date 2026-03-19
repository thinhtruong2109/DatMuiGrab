package dat_mui_grab.datmuigrab.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UpdateBankInfoRequest {

    @NotBlank
    private String bankName;

    @NotBlank
    private String bankAccountNumber;

    @NotBlank
    private String bankAccountHolder;
}
