package dat_mui_grab.datmuigrab.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import dat_mui_grab.datmuigrab.entity.CompanyWallet;
import dat_mui_grab.datmuigrab.entity.TransportCompany;

@Repository
public interface CompanyWalletRepository extends JpaRepository<CompanyWallet, UUID> {

    Optional<CompanyWallet> findByCompany(TransportCompany company);

    Optional<CompanyWallet> findByCompanyId(UUID companyId);
}
