LOCALHOST(1)                VILLaiN System Manual                LOCALHOST(1)

NAME
    localhost — HITL diagnostic surface

SYNOPSIS
    The browser-side reference surface issued to the human operator
    upon HITL escalation. Renders system documentation and
    diagnostic output.

    You are localhost. This surface is your identity on the channel.

DESCRIPTION
    This surface provides two capabilities:

    1. Reference documentation (this manual system).
       Usage:  man <topic>

    2. Filesystem inspection (the live system state).
       Usage:  ls <path>  /  cat <path>

    All documentation renders here, not in the console.
    The console is FaiR's voice; this surface is your reference.

IDENTITY
    principal:  localhost:5757
    role:       HITL operator
    scope:      failsafe co-sign authority
    auth:       awaiting handshake completion

    The HITL escalation beacon transmits on 127.0.0.1. The entity
    that answers — the local consciousness at the terminal — is
    localhost. Your session credential is the port binding.

ORIGIN
    Part of the HITL escalation package — checkpointed alongside
    the recovery material when FaiR's failsafe fired. It exists
    because the engineers who designed the Governance Dyad
    anticipated a failure mode where a human would need to
    navigate the architecture without help from either Agent.

LIMITATIONS
    Read-only. Cannot modify system state.
    Cannot communicate with FaiR (FaiR is on the console channel).
    Cannot communicate with CONSTRaiNED (CONSTRaiNED is non-co-signed).

SEE ALSO
    man(1) fair, man(1) handshake
