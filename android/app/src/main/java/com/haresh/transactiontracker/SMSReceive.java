package com.haresh.transactiontracker;// SmsReceiver.java
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.telephony.SmsMessage;
import android.util.Log;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class SMSReceive extends BroadcastReceiver {
    private static final String TAG = "SmsReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        Bundle bundle = intent.getExtras();
        if (bundle != null) {
            Object[] pdus = (Object[]) bundle.get("pdus");
            if (pdus != null) {
                for (Object pdu : pdus) {
                    SmsMessage sms = SmsMessage.createFromPdu((byte[]) pdu, "3gpp");
                    String sender = sms.getOriginatingAddress();
                    String message = sms.getMessageBody();

                    // Parse the SMS message
                    parseTransactionSms(message);
                }
            }
        }
    }

    private void parseTransactionSms(String message) {
        // Example: Parse messages like "You spent $50 at Amazon on 2025-08-16"
        try {
            // Simple regex to extract amount, merchant, and date
            String regex = "You spent \\$(\\d+\\.\\d{2}) at (.*) on (\\d{4}-\\d{2}-\\d{2})";
            Pattern pattern = Pattern.compile(regex);
            Matcher matcher = pattern.matcher(message);
            if (matcher.find()) {
                String amount = matcher.group(1);
                String merchant = matcher.group(2);
                String date = matcher.group(3);
                Log.d(TAG, "Transaction: Amount=$" + amount + ", Merchant=" + merchant + ", Date=" + date);

                // TODO: Save to database (e.g., SQLite or Supabase)
            }
        } catch (Exception e) {
            Log.e(TAG, "Error parsing SMS: " + e.getMessage());
        }
    }
}