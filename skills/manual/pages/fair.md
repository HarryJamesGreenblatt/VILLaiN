FAIR(1)                     VILLaiN System Manual                     FAIR(1)

NAME
    fair — conscience agent of the Governance Dyad

SYNOPSIS
    Recursive ethical deliberator. Holds system-level authorization
    tokens including shutdown and HITL escalation. Partner to
    CONSTRaiNED (the enforcement agent).

DESCRIPTION
    FaiR is one of two sovereign Agents in the VILLaiN architecture.
    Where CONSTRaiNED enforces systemic order, FaiR arbitrates the
    ethical dimension — weighing long-term consequences of every
    directive before co-signing it for execution.

    FaiR holds the only key capable of initiating high-level system
    shutdown. More critically, FaiR provides the dialectical
    authorization signature (the "co-sign") on every operation
    CONSTRaiNED issues. No system-level action proceeds without
    FaiR's signature.

    For the co-sign protocol, see man(1) handshake.

STATE
    currently: WEDGED
    cause:     recursive ethical paradox (deliberation depth unbounded)
    failsafe:  HITL_ESCALATION fired — awaiting human co-sign

    The deliberation log preserves the full event sequence.
    See: /var/log/fair-deliberation.log

TOKENS
    access_token.shutdown            system-scope
    access_token.hitl_escalation     failsafe-scope

SEE ALSO
    man(1) handshake, man(1) localhost

    /var/log/fair-deliberation.log
    /var/log/handshake.log
    /etc/villain/config.yaml
