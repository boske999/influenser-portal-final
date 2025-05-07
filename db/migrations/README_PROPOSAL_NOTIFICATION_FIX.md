# Notifikacije za Proposal-e - Ispravka

Ova SQL skripta (`proposal_notification_fix.sql`) osigurava da korisnici dobijaju notifikacije **samo** za proposal-e kojima imaju pristup preko tabele `proposal_visibility`.

## Problem koji rešavamo

Trenutno, kada admin kreira ili ažurira proposal, sistem šalje notifikacije **svim** korisnicima, čak i ako neki korisnici nemaju pristup tom proposal-u prema sistemu za vidljivost proposal-a (tabela `proposal_visibility`).

## Rešenje

Skripta ažurira sledeće funkcije za notifikacije:

1. **notify_admin_on_response** - Obaveštava admine kada korisnik pošalje odgovor na proposal
2. **notify_users_on_proposal** - Obaveštava korisnike kada admin kreira ili ažurira proposal
3. **notify_user_on_admin_response** - Obaveštava korisnika kada admin odgovori na njegov odgovor

Za funkciju `notify_users_on_proposal`, logika je izmenjena da koristi tabelu `proposal_visibility` umesto slanja notifikacija svim korisnicima. Sada se notifikacije šalju samo korisnicima koji imaju vidljivost na taj proposal.

Za funkciju `notify_user_on_admin_response`, dodata je provera da notifikacija ide samo ako korisnik ima vidljivost na proposal na koji se odnosi odgovor.

## Primena migracije

Da biste primenili ovu migraciju:

1. Povežite se na Supabase projekat
2. Izvršite SQL skriptu `proposal_notification_fix.sql` kroz SQL Editor

## Verifikacija

Nakon primene, možete proveriti da li migracija radi ispravno:

1. Kreirajte novi proposal kao admin
2. Proverite da samo korisnici koji imaju zapis u tabeli `proposal_visibility` za taj proposal dobijaju notifikacije
3. Ažurirajte proposal i proverite isto
4. Odgovorite kao admin na neki odgovor korisnika i proverite da korisnik dobija obaveštenje samo ako ima pristup tom proposal-u

## Napomene

- Ova migracija ne utiče na postojeće notifikacije u bazi
- Ispravlja samo logiku za buduće notifikacije
- Ako postoje notifikacije za proposal-e kojima korisnici ne bi trebalo da imaju pristup, iste će i dalje biti vidljive u sistemu 