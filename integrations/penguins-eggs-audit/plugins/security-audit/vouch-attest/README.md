# vouch-attest

Cryptographic attestation for eggs ISO artifacts using [mitchellh/vouch](https://github.com/mitchellh/vouch).

## Usage

```bash
eggs produce --attest                  # produce ISO and sign it
eggs audit verify <iso-path>           # verify attestation bundle
```

## Configuration

```yaml
# /etc/penguins-eggs.d/audit.yaml
audit:
  attest: true
  key: /etc/penguins-eggs.d/keys/signing.key
  output_dir: /var/eggs/attestations
```

## Dependencies

- `vouch` binary on PATH — install from https://github.com/mitchellh/vouch/releases
