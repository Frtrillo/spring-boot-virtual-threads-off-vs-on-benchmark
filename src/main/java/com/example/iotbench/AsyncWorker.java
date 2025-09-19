package com.example.iotbench;

import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

@Service
public class AsyncWorker {

    @Async
    public CompletableFuture<Void> doBackgroundWork(String id, Map<String,Object> payload) {
        try {
            Thread.sleep(50); // simulate blocking IO
        } catch (InterruptedException e) { /* ignore */ }
        return CompletableFuture.completedFuture(null);
    }
}
