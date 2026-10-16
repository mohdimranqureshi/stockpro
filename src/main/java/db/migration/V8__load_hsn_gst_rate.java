package db.migration;

import org.flywaydb.core.api.migration.BaseJavaMigration;
import org.flywaydb.core.api.migration.Context;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.sql.PreparedStatement;
import java.util.ArrayList;
import java.util.List;

/** Loads HSN_SAC.csv (HSN Code, Description of Goods, GST Rate) into hsn_gst_rate. */
public class V8__load_hsn_gst_rate extends BaseJavaMigration {

    private static final String CSV = "HSN_SAC.csv";
    private static final int BATCH = 500;

    @Override
    public void migrate(Context context) throws Exception {
        try (InputStream in = getClass().getClassLoader().getResourceAsStream(CSV)) {
            if (in == null) throw new IllegalStateException(CSV + " not found on classpath");

            String sql = "INSERT INTO hsn_gst_rate (hsn_code, description, gst_rate) VALUES (?, ?, ?)";
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(in, StandardCharsets.UTF_8));
                 PreparedStatement ps = context.getConnection().prepareStatement(sql)) {

                boolean header = true;
                int pending = 0;
                List<String> row;
                while ((row = readRow(reader)) != null) {
                    if (header) { header = false; continue; }
                    if (row.size() < 3) continue;

                    String code = normalizeCode(row.get(0));
                    String desc = row.get(1).trim();
                    BigDecimal rate;
                    try {
                        rate = new BigDecimal(row.get(2).trim());
                    } catch (NumberFormatException e) {
                        continue;
                    }
                    if (code.isEmpty()) continue;

                    ps.setString(1, code);
                    ps.setString(2, desc);
                    ps.setBigDecimal(3, rate);
                    ps.addBatch();
                    if (++pending % BATCH == 0) ps.executeBatch();
                }
                ps.executeBatch();
            }
        }
    }

    /** The CSV drops leading zeros (e.g. 202 for 0202); restore them to an even length. */
    private static String normalizeCode(String raw) {
        String code = raw.trim();
        if (!code.matches("\\d+")) return "";
        return code.length() % 2 == 0 ? code : "0" + code;
    }

    /** Reads one CSV record, handling quoted fields, escaped quotes and embedded line breaks. */
    private static List<String> readRow(BufferedReader reader) throws IOException {
        List<String> fields = new ArrayList<>();
        StringBuilder cur = new StringBuilder();
        boolean quoted = false;
        boolean any = false;
        int c;
        while ((c = reader.read()) != -1) {
            any = true;
            char ch = (char) c;
            if (quoted) {
                if (ch == '"') {
                    reader.mark(1);
                    int next = reader.read();
                    if (next == '"') cur.append('"');
                    else {
                        quoted = false;
                        if (next != -1) reader.reset();
                    }
                } else {
                    cur.append(ch);
                }
            } else if (ch == '"') {
                quoted = true;
            } else if (ch == ',') {
                fields.add(cur.toString());
                cur.setLength(0);
            } else if (ch == '\n' || ch == '\r') {
                if (ch == '\r') {
                    reader.mark(1);
                    if (reader.read() != '\n') reader.reset();
                }
                if (cur.length() == 0 && fields.isEmpty()) { any = false; continue; }
                break;
            } else if (ch != '\uFEFF') {
                cur.append(ch);
            }
        }
        if (!any && fields.isEmpty() && cur.length() == 0) return null;
        fields.add(cur.toString());
        return fields;
    }
}
