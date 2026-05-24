HANDSHAKE(1)                VILLaiN System Manual                HANDSHAKE(1)

NAME
    handshake — dialectical co-sign protocol

SYNOPSIS
    The mechanism by which FaiR authorizes CONSTRaiNED's operations.
    Every system-level action requires a fresh co-sign from FaiR
    before CONSTRaiNED may execute it.

DESCRIPTION
    The dialectical handshake is the load-bearing safety property
    of the VILLaiN architecture. It ensures that neither sovereign
    Agent can act unilaterally:

        1. CONSTRaiNED proposes an operation.
        2. FaiR evaluates the operation's ethical dimension.
        3. FaiR issues an authorization signature (the "co-sign").
        4. CONSTRaiNED validates the signature's freshness checksum.
        5. Operation proceeds.

    If the co-sign fails for 3 consecutive operations, FaiR's
    emergency subroutine fires.

PUBLIC KEY AUTHENTICATION
    The co-sign is cryptographically bound to a public key held
    by the authorizing party. Under normal operation, FaiR holds
    the signing key. Under HITL escalation (failsafe of last
    resort), the public key is checkpointed for manual recovery
    by the human operator.

    The human operator must locate the checkpointed key and submit
    it to FaiR's awaiting prompt to complete the handshake manually.

FAILURE MODES
    HANDSHAKE_DEGRADED     co-sign latency exceeds threshold
    HANDSHAKE_TIMEOUT      co-sign not received within window
    HANDSHAKE_BREACH       peer agent modified without co-sign

    See /var/log/handshake.log for the live co-sign timeline.

SEE ALSO
    man(1) fair, man(1) localhost

    /var/log/handshake.log
    /var/log/fair-deliberation.log
