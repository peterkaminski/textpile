// Test endpoint to verify Durable Object binding
export async function onRequestGet({ env }) {
  const checks = {
    timestamp: new Date().toISOString(),
    checks: {}
  };

  // Check 1: Does the binding exist?
  checks.checks.binding_exists = !!env.POST_ID_ALLOCATOR;

  if (!env.POST_ID_ALLOCATOR) {
    return Response.json({
      success: false,
      error: "POST_ID_ALLOCATOR binding not found",
      ...checks
    }, { status: 503 });
  }

  // Check 2: Can we get a DO stub?
  try {
    const doId = env.POST_ID_ALLOCATOR.idFromName("global");
    checks.checks.can_get_id = true;

    const stub = env.POST_ID_ALLOCATOR.get(doId);
    checks.checks.can_get_stub = true;

    // Check 3: Can we call the DO?
    const response = await stub.fetch("https://do/allocate", {
      method: "POST"
    });

    checks.checks.do_response_status = response.status;
    checks.checks.do_response_ok = response.ok;

    const responseText = await response.text();
    checks.checks.do_response_body = responseText;

    if (response.ok) {
      checks.checks.can_allocate_id = true;
      try {
        const data = JSON.parse(responseText);
        checks.checks.allocated_id = data.id;
      } catch (e) {
        checks.checks.json_parse_error = e.message;
      }
    } else {
      checks.checks.can_allocate_id = false;
    }

    return Response.json({
      success: response.ok,
      message: response.ok ? "Durable Object is working!" : "Durable Object responded with error",
      ...checks
    }, { status: response.ok ? 200 : 503 });

  } catch (err) {
    checks.checks.error = err.message;
    checks.checks.error_stack = err.stack;

    return Response.json({
      success: false,
      error: "Error testing Durable Object",
      ...checks
    }, { status: 503 });
  }
}
