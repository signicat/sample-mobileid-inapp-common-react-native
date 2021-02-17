package com.signicat.sampleapp.inapp;

import android.app.Dialog;
import android.os.Bundle;
import android.view.KeyEvent;
import android.view.LayoutInflater;
import android.view.View;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.DialogFragment;

import com.google.android.material.dialog.MaterialAlertDialogBuilder;

public class FingerprintDialogFragment extends DialogFragment {

    private static final String ARG_DIALOG_TITLE = "fingerprint_dialog_title";
    private static final String ARG_DIALOG_DESCRIPTION = "fingerprint_dialog_description";
    private static final String ARG_DIALOG_NEGATIVE_BUTTON_TEXT = "fingerprint_negative_button_text";
    private OnCancelListener mOnCancelListener;

    public static FingerprintDialogFragment newInstance(int title, int description, int negativeButtonText) {
        FingerprintDialogFragment fingerprintDialogFragment = new FingerprintDialogFragment();
        Bundle args = new Bundle();
        args.putInt(ARG_DIALOG_TITLE, title);
        args.putInt(ARG_DIALOG_DESCRIPTION, description);
        args.putInt(ARG_DIALOG_NEGATIVE_BUTTON_TEXT, negativeButtonText);
        fingerprintDialogFragment.setArguments(args);

        return fingerprintDialogFragment;
    }

    @NonNull
    @Override
    public Dialog onCreateDialog(@Nullable Bundle savedInstanceState) {
        Bundle args = getArguments();
        int title = args.getInt(ARG_DIALOG_TITLE);
        int description = args.getInt(ARG_DIALOG_DESCRIPTION);
        int negativeButtonText = args.getInt(ARG_DIALOG_NEGATIVE_BUTTON_TEXT);

        MaterialAlertDialogBuilder builder = new MaterialAlertDialogBuilder(getActivity(), R.style.MaterialAlertDialog_Rounded);

        LayoutInflater inflater = getActivity().getLayoutInflater();
        View view = inflater.inflate(R.layout.fragment_fingerprint_dialog, null);

        TextView titleTextView = view.findViewById(R.id.fingerprint_title);
        titleTextView.setText(title);

        TextView descriptionTextView = view.findViewById(R.id.fingerprint_description);
        descriptionTextView.setText(description);

        builder.setView(view);
        builder.setCancelable(false);
        builder.setNeutralButton(negativeButtonText, (dialog, which) -> {
            if (mOnCancelListener != null) mOnCancelListener.onCancel();
        });

        Dialog dialog = builder.create();
        dialog.setCanceledOnTouchOutside(false);
        dialog.setOnKeyListener((ignore, keyCode, event) -> {
            // Prevent dialog close on back press button
            return keyCode == KeyEvent.KEYCODE_BACK;
        });

        return dialog;
    }

    public void setOnCancelListener(OnCancelListener onCancelListener) {
        mOnCancelListener = onCancelListener;
    }

    public interface OnCancelListener {
        void onCancel();
    }
}