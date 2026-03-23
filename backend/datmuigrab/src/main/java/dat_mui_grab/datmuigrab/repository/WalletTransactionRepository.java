package dat_mui_grab.datmuigrab.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import dat_mui_grab.datmuigrab.entity.CompanyWallet;
import dat_mui_grab.datmuigrab.entity.WalletTransaction;

@Repository
public interface WalletTransactionRepository extends JpaRepository<WalletTransaction, UUID> {

    @EntityGraph(attributePaths = {"wallet"})
    List<WalletTransaction> findAllByWalletOrderByCreatedAtDesc(CompanyWallet wallet);

    @EntityGraph(attributePaths = {"wallet"})
    List<WalletTransaction> findAllByWalletIdOrderByCreatedAtDesc(UUID walletId);
}
