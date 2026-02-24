<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('show_activity_log_alert_popup')->default(true)->after('isActive');
            $table->boolean('show_loan_request_alert_popup')->default(true)->after('show_activity_log_alert_popup');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['show_activity_log_alert_popup', 'show_loan_request_alert_popup']);
        });
    }
};
