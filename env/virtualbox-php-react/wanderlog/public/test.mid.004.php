<?php
/**
Simple Dependency Injection Example
Prompt:
Write a Mailer class that takes a Transport object via its constructor. Implement both SmtpTransport and SendmailTransport classes and demonstrate swapping them.
 */

interface Transport
{
    public function send(string $to, string $message): void;
}

class SmtpTransport implements Transport
{
    public function send(string $to, string $message): void
    {
        echo "Sending via SMTP to $to: $message\n";
    }
}

class SendmailTransport implements Transport
{
    public function send(string $to, string $message): void
    {
        echo "Sending via Sendmail to $to: $message\n";
    }
}

class Mailer
{
    private Transport $transport;

    public function __construct(Transport $transport)
    {
        $this->transport = $transport;
    }

    public function sendEmail(string $to, string $message): void
    {
        $this->transport->send($to, $message);
    }
}

// 🔁 Inject a transport type:
$smtpMailer = new Mailer(new SmtpTransport());
$smtpMailer->sendEmail('alice@example.com', 'Hello via SMTP');

$sendmailMailer = new Mailer(new SendmailTransport());
$sendmailMailer->sendEmail('bob@example.com', 'Hello via Sendmail');
