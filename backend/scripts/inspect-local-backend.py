import ctypes
from ctypes import wintypes

kernel = ctypes.WinDLL('kernel32', use_last_error=True)
kernel.OpenProcess.restype = wintypes.HANDLE
kernel.CloseHandle.argtypes = [wintypes.HANDLE]
ntdll = ctypes.WinDLL('ntdll')

class UnicodeString(ctypes.Structure):
    _fields_ = [('Length', wintypes.USHORT), ('MaximumLength', wintypes.USHORT), ('Buffer', ctypes.c_void_p)]

handle = kernel.OpenProcess(0x1000, False, 26520)
if not handle:
    raise ctypes.WinError(ctypes.get_last_error())
try:
    required = wintypes.ULONG()
    ntdll.NtQueryInformationProcess(ctypes.c_void_p(handle), 60, None, 0, ctypes.byref(required))
    buffer = ctypes.create_string_buffer(required.value)
    status = ntdll.NtQueryInformationProcess(ctypes.c_void_p(handle), 60, buffer, required, ctypes.byref(required))
    if status != 0:
        raise RuntimeError('Process query failed: ' + str(status))
    value = UnicodeString.from_buffer(buffer)
    print(ctypes.wstring_at(value.Buffer, value.Length // 2))
finally:
    kernel.CloseHandle(handle)
