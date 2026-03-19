package dat_mui_grab.datmuigrab.service;

import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    public void sendOtp(String toEmail, String otp) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("Ma OTP xac thuc tai khoan Dat Mui Grab");
        message.setText(
                "Xin chao,\n\n" +
                "Ma OTP cua ban la: " + otp + "\n\n" +
                "Ma co hieu luc trong 5 phut.\n" +
                "Vui long khong chia se ma nay voi nguoi khac.\n\n" +
                "Dat Mui Grab"
        );
        mailSender.send(message);
    }
}
